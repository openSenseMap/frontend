import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { Button } from "~/components/ui/button";

type CountryDropdownProps = {
  country: string;
  setCountry: any;
  trigger: string;
};
export default function CountryDropdown({
  country,
  setCountry,
  trigger,
}: CountryDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="flex w-full" variant="outline" size={"lg"}>
          <ChevronDown className="h-4 w-4 transition-transform duration-200" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40">
        <DropdownMenuRadioGroup value={country} onValueChange={setCountry}>
          <DropdownMenuRadioItem value="AF">Afghanistan</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="AX">
            Aland Islands
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="AL">Albania</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="DZ">Algeria</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="AS">
            American Samoa
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="AD">Andorra</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="AO">Angola</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="AI">Anguilla</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="AQ">Antarctica</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="AG">
            Antigua and Barbuda
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="AR">Argentina</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="AM">Armenia</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="AW">Aruba</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="AU">Australia</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="AT">Austria</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="AZ">Azerbaijan</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="BS">Bahamas</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="BH">Bahrain</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="BD">Bangladesh</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="BB">Barbados</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="BY">Belarus</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="BE">Belgium</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="BZ">Belize</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="BJ">Benin</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="BM">Bermuda</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="BT">Bhutan</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="BO">Bolivia</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="BQ">
            Bonaire, Sint Eustatius and Saba
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="BA">
            Bosnia and Herzegovina
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="BW">Botswana</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="BV">
            Bouvet Island
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="BR">Brazil</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="IO">
            British Indian Ocean Territory
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="BN">
            Brunei Darussalam
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="BG">Bulgaria</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="BF">Burkina Faso</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="BI">Burundi</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="KH">Cambodia</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="CM">Cameroon</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="CA">Canada</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="CV">Cape Verde</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="KY">
            Cayman Islands
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="CF">
            Central African Republic
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="TD">Chad</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="CL">Chile</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="CN">China</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="CX">
            Christmas Island
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="CC">
            Cocos (Keeling) Islands
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="CO">Colombia</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="KM">Comoros</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="CG">Congo</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="CD">
            Congo, Democratic Republic of the Congo
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="CK">Cook Islands</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="CR">Costa Rica</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="CI">
            Cote D'Ivoire
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="HR">Croatia</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="CU">Cuba</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="CW">Curacao</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="CY">Cyprus</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="CZ">
            Czech Republic
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="DK">Denmark</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="DJ">Djibouti</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="DM">Dominica</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="DO">
            Dominican Republic
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="EC">Ecuador</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="EG">Egypt</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="SV">El Salvador</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="GQ">
            Equatorial Guinea
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="ER">Eritrea</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="EE">Estonia</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="ET">Ethiopia</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="FK">
            Falkland Islands (Malvinas)
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="FO">
            Faroe Islands
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="FJ">Fiji</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="FI">Finland</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="FR">France</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="GF">
            French Guiana
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="PF">
            French Polynesia
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="TF">
            French Southern Territories
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="GA">Gabon</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="GM">Gambia</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="GE">Georgia</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="DE">Germany</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="GH">Ghana</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="GI">Gibraltar</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="GR">Greece</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="GL">Greenland</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="GD">Grenada</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="GP">Guadeloupe</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="GU">Guam</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="GT">Guatemala</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="GG">Guernsey</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="GN">Guinea</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="GW">
            Guinea-Bissau
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="GY">Guyana</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="HT">Haiti</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="HM">
            Heard Island and Mcdonald Islands
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="VA">
            Holy See (Vatican City State)
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="HN">Honduras</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="HK">Hong Kong</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="HU">Hungary</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="IS">Iceland</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="IN">India</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="ID">Indonesia</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="IR">
            Iran, Islamic Republic of
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="IQ">Iraq</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="IE">Ireland</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="IM">Isle of Man</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="IL">Israel</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="IT">Italy</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="JM">Jamaica</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="JP">Japan</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="JE">Jersey</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="JO">Jordan</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="KZ">Kazakhstan</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="KE">Kenya</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="KI">Kiribati</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="KP">
            Korea, Democratic People's Republic of
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="KR">
            Korea, Republic of
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="XK">Kosovo</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="KW">Kuwait</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="KG">Kyrgyzstan</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="LA">
            Lao People's Democratic Republic
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="LV">Latvia</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="LB">Lebanon</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="LS">Lesotho</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="LR">Liberia</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="LY">
            Libyan Arab Jamahiriya
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="LI">
            Liechtenstein
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="LT">Lithuania</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="LU">Luxembourg</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="MO">Macao</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="MK">
            Macedonia, the Former Yugoslav Republic of
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="MG">Madagascar</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="MW">Malawi</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="MY">Malaysia</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="MV">Maldives</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="ML">Mali</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="MT">Malta</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="MH">
            Marshall Islands
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="MQ">Martinique</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="MR">Mauritania</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="MU">Mauritius</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="YT">Mayotte</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="MX">Mexico</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="FM">
            Micronesia, Federated States of
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="MD">
            Moldova, Republic of
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="MC">Monaco</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="MN">Mongolia</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="ME">Montenegro</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="MS">Montserrat</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="MA">Morocco</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="MZ">Mozambique</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="MM">Myanmar</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="NA">Namibia</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="NR">Nauru</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="NP">Nepal</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="NL">Netherlands</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="AN">
            Netherlands Antilles
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="NC">
            New Caledonia
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="NZ">New Zealand</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="NI">Nicaragua</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="NE">Niger</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="NG">Nigeria</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="NU">Niue</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="NF">
            Norfolk Island
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="MP">
            Northern Mariana Islands
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="NO">Norway</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="OM">Oman</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="PK">Pakistan</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="PW">Palau</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="PS">
            Palestinian Territory, Occupied
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="PA">Panama</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="PG">
            Papua New Guinea
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="PY">Paraguay</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="PE">Peru</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="PH">Philippines</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="PN">Pitcairn</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="PL">Poland</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="PT">Portugal</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="PR">Puerto Rico</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="QA">Qatar</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="RE">Reunion</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="RO">Romania</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="RU">
            Russian Federation
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="RW">Rwanda</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="BL">
            Saint Barthelemy
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="SH">Saint Helena</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="KN">
            Saint Kitts and Nevis
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="LC">Saint Lucia</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="MF">Saint Martin</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="PM">
            Saint Pierre and Miquelon
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="VC">
            Saint Vincent and the Grenadines
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="WS">Samoa</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="SM">San Marino</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="ST">
            Sao Tome and Principe
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="SA">Saudi Arabia</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="SN">Senegal</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="RS">Serbia</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="CS">
            Serbia and Montenegro
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="SC">Seychelles</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="SL">Sierra Leone</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="SG">Singapore</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="SX">Sint Maarten</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="SK">Slovakia</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="SI">Slovenia</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="SB">
            Solomon Islands
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="SO">Somalia</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="ZA">South Africa</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="GS">
            South Georgia and the South Sandwich Islands
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="SS">South Sudan</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="ES">Spain</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="LK">Sri Lanka</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="SD">Sudan</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="SR">Suriname</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="SJ">
            Svalbard and Jan Mayen
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="SZ">Swaziland</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="SE">Sweden</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="CH">Switzerland</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="SY">
            Syrian Arab Republic
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="TW">
            Taiwan, Province of China
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="TJ">Tajikistan</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="TZ">
            Tanzania, United Republic of
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="TH">Thailand</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="TL">Timor-Leste</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="TG">Togo</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="TK">Tokelau</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="TO">Tonga</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="TT">
            Trinidad and Tobago
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="TN">Tunisia</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="TR">Turkey</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="TM">Turkmenistan</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="TC">
            Turks and Caicos Islands
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="TV">Tuvalu</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="UG">Uganda</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="UA">Ukraine</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="AE">
            United Arab Emirates
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="GB">
            United Kingdom
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="US">
            United States
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="UM">
            United States Minor Outlying Islands
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="UY">Uruguay</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="UZ">Uzbekistan</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="VU">Vanuatu</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="VE">Venezuela</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="VN">Viet Nam</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="VG">
            Virgin Islands, British
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="VI">
            Virgin Islands, U.s.
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="WF">
            Wallis and Futuna
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="EH">
            Western Sahara
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="YE">Yemen</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="ZM">Zambia</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="ZW">Zimbabwe</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
